package br.com.oficina.application.dto;

import br.com.oficina.domain.vo.Vehicle;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceOrderRequestDTO(
    String clientId,
    Vehicle vehicle,
    LocalDateTime forecastDate,
    String observations,
    List<ItemOSRequestDTO> items
) {}
