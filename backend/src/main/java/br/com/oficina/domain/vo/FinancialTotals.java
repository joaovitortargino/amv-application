package br.com.oficina.domain.vo;

import java.math.BigDecimal;

public record FinancialTotals(
		BigDecimal subtotal,
		BigDecimal descont,
		BigDecimal impost,
		BigDecimal total
) {
	public static FinancialTotals reset() {
		return new FinancialTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
	}
}
