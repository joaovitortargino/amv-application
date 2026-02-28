package br.com.oficina.application.dto;

import br.com.oficina.domain.vo.Address;
import br.com.oficina.domain.vo.Contact;

public record RegisterRequestDTO(
		String name,
		String email,
		String password,

		String corporateReason,
		String fantasyName,
		String cnpj,
		Contact contact,
		Address address
) {}
