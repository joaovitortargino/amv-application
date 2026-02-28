package br.com.oficina.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ManualSlipRequestDTO(
		UUID clientId,
        BigDecimal originalValue,
        LocalDate dueDate
) {}
