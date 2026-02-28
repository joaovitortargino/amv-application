package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.PaymentMethod;
import br.com.oficina.domain.enums.RecurrencePeriod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateTitleDTO(
    String description,
    FinancialType type,
    String category,
    BigDecimal originalValue,
    LocalDate dueDate, // Data da primeira parcela
    PaymentMethod paymentMethod,
    UUID clientId,
    List<String> osId,
    
    // Dados de Parcelamento / Recorrência
    boolean isInstallment,          // É parcelado?
    Integer totalInstallments,      // Quantas parcelas? (Ex: 12)
    RecurrencePeriod period,        // Qual a frequência? (Ex: MONTHLY)
    Integer customDaysInterval      // Se for CUSTOM, quantos dias entre parcelas?
) {}
