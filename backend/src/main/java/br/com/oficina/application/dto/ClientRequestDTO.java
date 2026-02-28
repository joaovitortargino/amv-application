package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.domain.vo.Address;
import br.com.oficina.domain.vo.Contact;

public record ClientRequestDTO(
    String name,
    String document,
    ClientType type,
    Address address,
    Contact contact,
    String notes
) {}
