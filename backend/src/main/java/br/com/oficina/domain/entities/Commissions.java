package br.com.oficina.domain.entities;

import br.com.oficina.domain.enums.CommissionStatus;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Document(collection = "commissions")
public class Commissions {
	@Id
	private UUID id = UUID.randomUUID();
	private UUID enterpriseId; // Vinculo com a empresa
	private UUID mechanicId;
	private String mechanicName;                    //gravar nome pra ter histórico pra não quebrar se mudar cadastro

	private UUID osId;
	private String serviceName;                     //qual serviçoss que gerou a comissão

	private BigDecimal valueBaseService;            //valor base do serviço
	private BigDecimal percentageApplied;           //porcentagem aplicada
	private BigDecimal valueCommission;             //vai ser valor final pra pagar

	private LocalDate dateCalculation;
	private LocalDate paymentDate;                  //quando empresa pagou ele TODO: fazer parte de recibo de pagamento de comissão

	private CommissionStatus status;                          //PENDENTE, PAGO, CANCELADO
}
