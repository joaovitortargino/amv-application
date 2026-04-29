package br.com.oficina.application.dto;

import br.com.oficina.domain.enums.ClientSituation;
import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.domain.vo.Address;

public record ClientRequestDTO(
    String name,
    String fantasyName,
    String nickname,
    String document,
    ClientType type,
    ClientSituation situation,
    Address address,
    String emails,
    String telephones,
    String cellPhones,
    String notes
) {}
