package br.com.oficina.domain.entities;

import br.com.oficina.domain.enums.SlipSourceType;
import br.com.oficina.domain.enums.SlipStatus;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Document(collection = "slips")
public class Slips {

	@Id
	private UUID id = UUID.randomUUID();
	private UUID enterpriseId; // Vinculo com a empresa
	
	// Dados do Itaú
	private String idBoletoIndividual; // ID retornado pelo Itaú
	private String ourNumber; // Nosso Número (identificador no banco)
	private String digitableLine; // Linha digitável
	private String barCode; // Código de barras
	
	private BigDecimal value;
	private LocalDate dueDate;
	private LocalDate paymentDate;
	private LocalDate dateIssuance; // Data de emissão
	
	private SlipStatus status; // PENDENTE, PAGO, CANCELADO, VENCIDO
	
	private UUID payerId; // Quem paga (Cliente)
	private String payerName;
	private String payerDocument;
	
	private UUID sourceId; // Origem (ex: ID da OS, Título Financeiro)
	private SlipSourceType sourceType; // OS, AVULSO, CONTRATO
}
