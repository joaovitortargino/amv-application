package br.com.oficina.application.dto;

import br.com.oficina.domain.vo.Contact;
import java.math.BigDecimal;

public record MechanicRequestDTO(
    String name,
    String document,
    Contact contact,
    boolean active,
    BigDecimal standardCommissionPercentage
) {}
