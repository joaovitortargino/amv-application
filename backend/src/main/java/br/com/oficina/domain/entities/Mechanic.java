package br.com.oficina.domain.entities;

import br.com.oficina.domain.vo.Contact;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Document(collection="mechanics")
@CompoundIndexes({
		@CompoundIndex(name="enterprise_document_idx", def="{'enterpriseId': 1, 'document': 1}", unique=true)
})
public class Mechanic {

	@Id
	private UUID id = UUID.randomUUID();
	private long mechanicCode;
	private UUID enterpriseId;
	private String name;
	private String document;
	private Contact contact;
	private boolean active;
	private BigDecimal standardCommissionPercentage;
}
