package br.com.oficina.application.dto;

import br.com.oficina.domain.vo.Contact;
import java.math.BigDecimal;
import java.util.UUID;

public record MechanicResponseDTO(
    UUID id,
    String name,
    String document,
    Contact contact,
    boolean active,
    BigDecimal standardCommissionPercentage
) {}
