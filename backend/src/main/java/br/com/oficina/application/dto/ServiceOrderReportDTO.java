package br.com.oficina.application.dto;

import java.time.LocalDate;
import java.util.List;

public record ServiceOrderReportDTO(
    LocalDate startDate,
    LocalDate endDate,
    long totalOrders,
    long finishedOrders,
    long openOrders,
    long canceledOrders,
    List<ServiceOrderResponseDTO> orders
) {}
