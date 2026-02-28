package br.com.oficina.domain.vo;

import br.com.oficina.domain.enums.TypeItem;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemOS(
		String productServiceId,
		TypeItem type,
		String name,
		BigDecimal amount,
		BigDecimal unitValue,
		BigDecimal discount,
		BigDecimal total,
		UUID mechanicId,
		Long mechanicCode // Novo campo
) {
	public ItemOS {
		if(amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new IllegalArgumentException("Quantity must be positive");
		}
		BigDecimal calculated = amount.multiply(unitValue).subtract(discount);

		if(total.subtract(calculated).abs().compareTo(new BigDecimal("0.01")) > 0) {
			throw new IllegalArgumentException("Total is incorrect");
		}
	}
}
