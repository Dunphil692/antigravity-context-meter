import { BUILTIN_MODEL_SPECS, DEFAULT_MODEL_SPEC, ModelContextSpec, HealthLevel } from '../../types/context';

/**
 * 模型识别器与窗口自适应引擎 (Stage 1)
 */
export class ModelDetector {
  /**
   * 根据模型名称字符串匹配对应的规格
   */
  public static detectSpec(modelName?: string): ModelContextSpec {
    if (!modelName || typeof modelName !== 'string') {
      return DEFAULT_MODEL_SPEC;
    }

    const cleanedName = modelName.trim();
    for (const spec of BUILTIN_MODEL_SPECS) {
      if (spec.namePattern.test(cleanedName)) {
        return spec;
      }
    }

    return {
      ...DEFAULT_MODEL_SPEC,
      displayName: cleanedName,
    };
  }

  /**
   * 计算健康度级别 (Optimal / Moderate / Warning / Critical)
   */
  public static calculateHealth(percentage: number, spec: ModelContextSpec): HealthLevel {
    if (percentage >= spec.criticalThreshold) {
      return 'critical'; // > 85% 呼吸红光告警
    }
    if (percentage >= spec.warningThreshold) {
      return 'warning';  // 75% - 85% 警戒橙
    }
    if (percentage >= 0.5) {
      return 'moderate'; // 50% - 75% 琥珀黄
    }
    return 'optimal';    // 0% - 50% 翠绿健康
  }
}
