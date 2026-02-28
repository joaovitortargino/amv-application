package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.TypeItem;
import java.math.BigDecimal;
import java.util.UUID;

public record ItemOSRequestDTO(
    String productServiceId,
    TypeItem type,
    String name,
    BigDecimal amount,
    BigDecimal unitValue,
    BigDecimal discount,
    UUID mechanicId
) {}
