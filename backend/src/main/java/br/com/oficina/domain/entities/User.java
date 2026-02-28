package br.com.oficina.domain.entities;

import br.com.oficina.domain.enums.Roles;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;
import java.util.UUID;

@Data
@Document(collection = "users")
public class User {

	@Id
	private UUID id = UUID.randomUUID();

	@Indexed(unique = true)
	private String email;
	private String password;
	private String name;
	private UUID enterpriseId;
	private boolean active;
	private Set<Roles> roles;
}
