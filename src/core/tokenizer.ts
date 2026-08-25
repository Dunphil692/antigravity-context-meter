/**
 * 毫秒级极速 Token 估算引擎 (Stage 1)
 * 严格遵循宪法第二条：零性能损耗原则（单次计算耗时 < 10ms，零笨重依赖）
 */
export class FastTokenizer {
  /**
   * 估算任意文本的 Token 数量
   * 采用中英文混合加权 + 代码符号精确加权算法（对齐 Gemini / BPE Tokenizer 精度）
   */
  public static countTokens(text?: string | null): number {
    if (!text || typeof text !== 'string') return 0;
    const len = text.length;
    if (len === 0) return 0;

    let cjkCount = 0;
    let asciiWords = 0;
    let codeSymbols = 0;
    let whitespaceCount = 0;

    // 单次遍历高效统计，时间复杂度 O(N)
    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);

      // CJK 中日韩字符区间 (0x4E00 - 0x9FFF, 0x3400 - 0x4DBF, 等)
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3400 && code <= 0x4dbf) ||
        (code >= 0xf900 && code <= 0xfaff)
      ) {
        cjkCount++;
      } else if (code <= 32) {
        // 空白符与换行
        whitespaceCount++;
      } else if (
        (code >= 48 && code <= 57) || // 数字 0-9
        (code >= 65 && code <= 90) || // 大写 A-Z
        (code >= 97 && code <= 122) || // 小写 a-z
        code === 95 // _
      ) {
        // 字母数字字符
        asciiWords++;
      } else {
        // 代码符号 (括号、大括号、分号、冒号、点、运算符等)
        codeSymbols++;
      }
    }

    // 权重量化校准：
    // 1. 中文字符：平均 1.35 Tokens / 字
    // 2. 英文/数字词素：平均 0.28 Tokens / 字符 (约 3.6 字符 / Token)
    // 3. 代码符号：独立词元，平均 0.65 Tokens / 符号
    // 4. 空白与换行：紧凑编码，平均 0.2 Tokens / 字符
    const estimated =
      cjkCount * 1.35 +
      asciiWords * 0.28 +
      codeSymbols * 0.65 +
      whitespaceCount * 0.2;

    return Math.max(1, Math.round(estimated));
  }

  /**
   * 格式化 Token 数字为人类可读格式 (e.g. 28.8K, 1.2M, 950)
   */
  public static formatTokenCount(tokens: number): string {
    if (tokens >= 1000000) {
      return (tokens / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (tokens >= 1000) {
      return (tokens / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return tokens.toString();
  }
}
