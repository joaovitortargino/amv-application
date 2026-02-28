package br.com.oficina.domain.entities;

import br.com.oficina.domain.vo.Address;
import br.com.oficina.domain.vo.Contact;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Document(collection = "enterprise")
public class Enterprise {

	@Id
	private UUID id = UUID.randomUUID();
	private String corporateReason;
	private String fantasyName;
	private String cnpj;
	private Address address;
	private Contact contact;
	private LocalDateTime createdAt;
	private boolean active;
}
