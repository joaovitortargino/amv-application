package br.com.oficina.domain.entities;

import br.com.oficina.domain.enums.ClientSituation;
import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.domain.vo.Address;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Document(collection = "clients")
@CompoundIndexes({
    @CompoundIndex(name = "enterprise_document_idx", def = "{'enterpriseId': 1, 'document': 1}", unique = true)
})
public class Client {

	@Id
	private UUID id = UUID.randomUUID();
	
	private UUID enterpriseId; // Vinculo com a empresa (Multi-tenancy)
	
	private String name;
	private String fantasyName;
	private String nickname;
	
	private String document; // CPF ou CNPJ (apenas números)
	
	private ClientType type; // PF ou PJ
	private ClientSituation situation;
	
	private Address address;
	private String emails;
	private String telephones;
	private String cellPhones;
	
	private LocalDateTime createdAt = LocalDateTime.now();
	private LocalDateTime lastUpdate = LocalDateTime.now();
	
	private boolean active = true;
	
	// Campos úteis para CRM
	private String notes; // Observações sobre o cliente (ex: "Cliente chato", "Paga em dia")
}
