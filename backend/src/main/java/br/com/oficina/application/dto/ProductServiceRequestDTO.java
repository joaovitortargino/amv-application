package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.TypeItem;
import java.math.BigDecimal;

public record ProductServiceRequestDTO(
    String name,
    String description,
    TypeItem type,
    BigDecimal price,
    BigDecimal salePrice,
    BigDecimal priceCost,
    boolean active
) {}
