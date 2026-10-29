Shader "Shader Forge/GasFlow_HDRP" {
    Properties {
        _MainTex ("MainTex", 2D) = "black" {}
        _DetailTex ("DetailTex", 2D) = "white" {}
        _TintColor ("Color", Color) = (0, 1, 1, 1)
        [Header(Flow Settings)]
        _GlobalSpeed ("Global Speed", Range(0, 10)) = 0.5
        _Direction ("Flow Direction", Vector) = (0, 1, 0, 0)
        [ToggleUI] _ReverseFlow ("Reverse Flow (反向流动)", Float) = 0
        _MainSpeedRatio ("Main Speed Ratio", Range(0, 1)) = 0.2
        _DetailSpeedRatio ("Detail Speed Ratio", Range(0, 1)) = 0.4
        _TimeOffset ("Time Offset", Float) = 0
        [Header(Appearance)]
        _AlphaPower ("Alpha Power", Range(0.2, 4)) = 1
        _Density ("Density", Range(0, 8)) = 1
        [Header(Inner Glow)]
        _InnerGlowColor ("Inner Glow Color", Color) = (1, 1, 1, 1)
        _InnerGlowIntensity ("Inner Glow Intensity", Range(0, 5)) = 1
        _InnerGlowPower ("Inner Glow Power", Range(0.5, 4)) = 2
        [Header(Progress Control)]
        _FlowProgress ("Flow Progress", Range(0, 1)) = 0
        [Header(Uniformity Control)] // 新增均匀性控制参数
        _EdgeFadePower ("Edge Fade Power", Range(0.1, 10)) = 2
        _RadialFadePower ("Radial Fade Power", Range(0.1, 10)) = 1
        _UniformIntensity ("Uniform Intensity", Range(0, 1)) = 0.5
    }

    SubShader {
        Tags {
            "RenderPipeline" = "HDRenderPipeline"
            "RenderType" = "Translucent"
            "Queue" = "Transparent+100"
            "DisableBatching" = "True"
        }

        // 主渲染Pass
        Pass {
            Name "ForwardOnly"
            Tags { "LightMode" = "ForwardOnly" }

            Blend SrcAlpha One
            ZWrite Off
            ZTest LEqual
            Cull Off
            ColorMask RGB

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #pragma target 4.5
            #pragma only_renderers d3d11 playstation xboxone xboxseries vulkan metal switch

            // 包含所有必要文件
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
            #include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"

            struct Attributes {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
                float4 color : COLOR;
            };

            struct Varyings {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float4 color : COLOR;
            };

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);
            TEXTURE2D(_DetailTex);
            SAMPLER(sampler_DetailTex);

            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float4 _DetailTex_ST;
                float4 _TintColor;
                float _GlobalSpeed;
                float2 _Direction;
                float _ReverseFlow;
                float _MainSpeedRatio;
                float _DetailSpeedRatio;
                float _AlphaPower;
                float _Density;
                float _TimeOffset;
                float4 _InnerGlowColor;
                float _InnerGlowIntensity;
                float _InnerGlowPower;
                float _FlowProgress;
                // 新增均匀性控制参数
                float _EdgeFadePower;
                float _RadialFadePower;
                float _UniformIntensity;
            CBUFFER_END

            Varyings vert(Attributes input) {
                Varyings output;
                // 安全的空间变换
                output.positionCS = TransformWorldToHClip(TransformObjectToWorld(input.positionOS.xyz));
                output.uv = input.uv;
                output.color = input.color;
                return output;
            }

            half4 frag(Varyings input) : SV_Target {
                // 计算时间和UV流动
                float time = (_Time.y * _GlobalSpeed) + _TimeOffset;
                float2 dir = normalize(_Direction);
                // Reverse texture scrolling without mirroring the mesh UV or appearance masks.
                // ToggleUI uses a material float, so runtime changes need no shader keyword.
                float flowSign = _ReverseFlow >= 0.5 ? -1.0 : 1.0;
                float2 flowDirection = dir * flowSign;
                float2 mainSpeed = flowDirection * time * _MainSpeedRatio;
                float2 detailSpeed = flowDirection * time * _DetailSpeedRatio;

                float2 mainUV = input.uv * _MainTex_ST.xy + _MainTex_ST.zw + mainSpeed;
                float2 detailUV = input.uv * _DetailTex_ST.xy + _DetailTex_ST.zw + detailSpeed;

                // 采样纹理
                half4 mainTex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, mainUV);
                half4 detailTex = SAMPLE_TEXTURE2D(_DetailTex, sampler_DetailTex, detailUV);

                // 透明度计算
                half alphaSource = saturate(mainTex.a * detailTex.b);
                half flowMask = pow(alphaSource, _AlphaPower);

                // 修改边缘衰减计算 - 使用更均匀的衰减
                float verticalPos = saturate(input.uv.x);
                float edgeFadeX = pow(1 - abs(verticalPos * 2 - 1), _EdgeFadePower);

                // 修改径向衰减计算 - 使用更均匀的衰减
                float2 center = float2(0.5, 0.5);
                float radial = pow(1 - saturate(distance(input.uv, center) * 2), _RadialFadePower);

                // 组合边缘和径向衰减
                float edgeFade = saturate(edgeFadeX * radial);

                // 内部光晕
                float innerGlowMask = pow(radial, _InnerGlowPower);
                float3 innerGlow = _InnerGlowColor.rgb * _InnerGlowIntensity * innerGlowMask;

                // 基础透明度 - 使用更均匀的计算
                half alpha = flowMask * lerp(edgeFade, 1.0, _UniformIntensity) * _TintColor.a * _Density;
                alpha = saturate(alpha);

                // 流动进度控制
                float flowPos = dot(input.uv, dir);
                float maxFlow = dot(float2(1,1), dir);
                flowPos /= maxFlow;
                // Timeline animates _FlowProgress separately from texture scrolling.
                // Reverse its UV-space origin as well, so filling starts at the other end.
                if (_ReverseFlow >= 0.5) {
                    flowPos = 1.0 - flowPos;
                }

                // 修改进度遮罩计算 - 使用更平滑的过渡
                float progressMask = smoothstep(_FlowProgress - 0.15, _FlowProgress + 0.15, flowPos);
                progressMask = 1 - progressMask;
                alpha *= progressMask;

                // 最终颜色混合 - 使用更均匀的颜色混合
                half3 baseColor = lerp(mainTex.rgb, detailTex.rgb, 0.3) * _TintColor.rgb * 2;
                half3 finalColor = lerp(baseColor, baseColor + innerGlow, _UniformIntensity);

                return half4(finalColor * input.color.rgb, alpha);
            }
            ENDHLSL
        }

        // 深度写入Pass
        Pass {
            Name "DepthForwardOnly"
            Tags { "LightMode" = "DepthForwardOnly" }

            ZWrite On
            ZTest LEqual
            Cull Off
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag

            #pragma target 4.5
            #pragma only_renderers d3d11 playstation xboxone xboxseries vulkan metal switch

            // 包含HDRP核心变换函数
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
            #include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"

            struct Attributes {
                float4 positionOS : POSITION;
            };

            struct Varyings {
                float4 positionCS : SV_POSITION;
            };

            Varyings Vert(Attributes input) {
                Varyings output;
                // 使用与主Pass相同的变换
                output.positionCS = TransformWorldToHClip(TransformObjectToWorld(input.positionOS.xyz));
                return output;
            }

            void Frag(Varyings input) {}

            ENDHLSL
        }

        // Shadowcaster Pass
        Pass {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }

            ZWrite On
            ZTest LEqual
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag

            #pragma target 4.5
            #pragma only_renderers d3d11 playstation xboxone xboxseries vulkan metal switch

            // 包含HDRP核心变换函数
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
            #include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"

            struct Attributes {
                float4 positionOS : POSITION;
            };

            struct Varyings {
                float4 positionCS : SV_POSITION;
            };

            Varyings Vert(Attributes input) {
                Varyings output;
                // 使用与主Pass相同的变换
                output.positionCS = TransformWorldToHClip(TransformObjectToWorld(input.positionOS.xyz));
                return output;
            }

            void Frag(Varyings input) {}

            ENDHLSL
        }
    }
    FallBack "Hidden/HDRP/FallbackError"
}
