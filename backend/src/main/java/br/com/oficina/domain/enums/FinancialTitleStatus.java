package br.com.oficina.domain.enums;

import lombok.Getter;

@Getter
public enum FinancialTitleStatus {
	OPEN("Em Aberto"),
	PAYABLE("A Pagar"),
	PAID("Pago"),
	PARTIALLY_PAID("Pago Parcialmente"),
	DELAYED("Atrasado"),
	CANCELED("Cancelado");

	private final String description;

	FinancialTitleStatus(String description) {
		this.description = description;
	}
}
