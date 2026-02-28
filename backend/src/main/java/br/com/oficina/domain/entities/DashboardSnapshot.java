package br.com.oficina.domain.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Document(collection = "dashboard_snapshots")
@CompoundIndexes({
    @CompoundIndex(name = "enterprise_date_idx", def = "{'enterpriseId': 1, 'date': 1}", unique = true)
})
public class DashboardSnapshot {

    @Id
    private UUID id = UUID.randomUUID();
    
    private UUID enterpriseId;
    private LocalDate date; // Data do fechamento (ex: 2023-10-27)

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;

    private BigDecimal totalRevenue; // Faturamento total do dia (OS finalizadas)
    private BigDecimal totalCommissions; // Comissões geradas no dia

    private BigDecimal openedOsCount; // Qtd de OS abertas (novas)
    private BigDecimal delayedOsCount; // Qtd de OS que dormiram atrasadas neste dia
    private BigDecimal pendingTitles;
}
