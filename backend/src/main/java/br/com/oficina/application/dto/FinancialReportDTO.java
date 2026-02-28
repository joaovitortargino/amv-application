package br.com.oficina.application.dto;

import br.com.oficina.domain.entities.FinancialTitle;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinancialReportDTO(
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal balance, // Saldo (Receita - Despesa)
    List<FinancialTitle> titles
) {}
