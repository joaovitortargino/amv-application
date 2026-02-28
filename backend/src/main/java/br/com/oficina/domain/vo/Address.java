package br.com.oficina.domain.vo;

public record Address(
		String cep,
		String publicPlace,
		String number,
		String complement,
		String district,
		String city,
		String state
) {}
