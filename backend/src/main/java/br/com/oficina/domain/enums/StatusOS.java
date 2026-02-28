package br.com.oficina.domain.enums;

import lombok.Getter;

@Getter
public enum StatusOS {
	OPEN("Em Aberto"),
	PENDING("Pendente"),
	IN_PROGRESS("Em Andamento"),
	CANCELED("Cancelada"),
	FINISHED("Finalizada");

	private final String description;

	StatusOS(String description) {
		this.description = description;
	}
}
