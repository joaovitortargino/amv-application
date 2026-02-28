package br.com.oficina.domain.entities;

import br.com.oficina.domain.vo.FinancialTotals;
import br.com.oficina.domain.enums.StatusOS;
import br.com.oficina.domain.vo.ItemOS;
import br.com.oficina.domain.vo.Vehicle;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Document(collection = "service_orders")
public class ServiceOrder {

	@Id
	private UUID id = UUID.randomUUID();
	private UUID enterpriseId; // Vinculo com a empresa
	private String OSnumber;                               //sequencial para quesito de tela
	private String clientId;
	private Vehicle vehicle;

	private List<ItemOS> itemOS;
	private FinancialTotals totals;                        //totais financeiro
	private StatusOS status;

	private LocalDateTime createdAt = LocalDateTime.now(); //data criação
	private LocalDateTime updatedAt;                       //data atualização
	private LocalDateTime forecastDate;                    //data previsão
	private LocalDateTime completionDate;                  //data conclusão

	private List<String> slipsId;                          //boletosId
	private UUID financialTitleId;                         // ID do Título Financeiro Gerado

	private String observations;
}
