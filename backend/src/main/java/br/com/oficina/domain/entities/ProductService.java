package br.com.oficina.domain.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Document(collection = "products_services")
public class ProductService {

	@Id
	private UUID id = UUID.randomUUID();
	private UUID enterpriseId; // Vinculo com a empresa
	private String name;
	private String description;
	private String type; //produto ou serviço
	private BigDecimal price;

	//para item (produto)
	private BigDecimal salePrice;
	private BigDecimal priceCost;

	private boolean active;
}
