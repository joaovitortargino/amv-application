package br.com.oficina.domain.entities;

import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.PaymentMethod;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Document(collection = "financial_titles")
public class FinancialTitle {

	@Id
	private UUID id = UUID.randomUUID();
	private UUID enterpriseId; // Vinculo com a empresa
	
	private String description;
	private FinancialType type; // RECEITA ou DESPESA
	private String category; // Ex: "Aluguel", "Peças", "Serviços"
	
	private BigDecimal originalValue; // Valor original do título
	private BigDecimal paidValue; // Valor efetivamente pago
	private BigDecimal discount; // Descontos concedidos
	private BigDecimal interest; // Juros/Multa cobrados
	
	private LocalDate competenceDate; // Data de competência (quando o fato gerador ocorreu)
	private LocalDate dueDate; // Data de vencimento
	private LocalDate paymentDate; // Data do pagamento
	
	private FinancialTitleStatus status; // PENDENTE, PAGO, ATRASADO, CANCELADO
	private PaymentMethod paymentMethod; // Forma de pagamento (Boleto, Pix, etc)
	
	// Vinculos
	private UUID clientId; // ID do cliente (se houver) - Changed to String to match usage in service
	private String osId; // ID da OS (se houver)
	private UUID relatedEntityId; // ID genérico de quem gerou (OS, Cliente, Fornecedor)
	private String slipId; // ID do boleto gerado (se houver)
	
	// Controle de Parcelamento
	private Integer installmentNumber; // Número da parcela (ex: 1)
	private Integer totalInstallments; // Total de parcelas (ex: 12)
	private String installmentIdentifier; // ID único que agrupa todas as parcelas de uma mesma venda
}
