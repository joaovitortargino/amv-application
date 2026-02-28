package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.TypeItem;
import java.math.BigDecimal;
import java.util.UUID;

public record ProductServiceResponseDTO(
    UUID id,
    String name,
    String description,
    TypeItem type,
    BigDecimal price,
    BigDecimal salePrice,
    BigDecimal priceCost,
    boolean active
) {}
