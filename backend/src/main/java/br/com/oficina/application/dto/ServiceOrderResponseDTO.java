package br.com.oficina.application.dto;

import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.enums.StatusOS;
import br.com.oficina.domain.vo.FinancialTotals;
import br.com.oficina.domain.vo.ItemOS;
import br.com.oficina.domain.vo.Vehicle;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ServiceOrderResponseDTO(
    UUID id,
    String osNumber,
    String clientId,
    Vehicle vehicle,
    List<ItemOS> items,
    FinancialTotals totals,
    StatusOS status,
    LocalDateTime createdAt,
    LocalDateTime forecastDate,
    LocalDateTime completionDate,
    String observations,
    FinancialTitle financialTitle // Novo campo
) {}
