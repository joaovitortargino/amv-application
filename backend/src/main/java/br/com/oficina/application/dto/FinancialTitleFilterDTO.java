package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record FinancialTitleFilterDTO(
		FinancialType type,
		FinancialTitleStatus status,
		String description,

		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate dueDateStart,

		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate dueDateEnd,

		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate competenceDateStart,

		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate competenceDateEnd
) {}