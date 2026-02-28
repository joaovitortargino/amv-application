package br.com.oficina.application.service;

import br.com.oficina.domain.entities.Commissions;
import br.com.oficina.domain.entities.DashboardSnapshot;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.ServiceOrder;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.StatusOS;
import br.com.oficina.infrastructure.persistence.CommissionsRepository;
import br.com.oficina.infrastructure.persistence.DashboardSnapshotRepository;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.infrastructure.persistence.ServiceOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final DashboardSnapshotRepository snapshotRepository;
    private final ServiceOrderRepository osRepository;
    private final CommissionsRepository commissionsRepository;
    private final FinancialTitleRepository financialTitleRepository;

    @Transactional
    public void processDailyClosing(UUID enterpriseId, LocalDate date) {
        log.info("Processing daily closing for enterprise {} on date {}", enterpriseId, date);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // OS finalizadas no dia → totalIncome
        List<ServiceOrder> finishedOs = osRepository
                .findByEnterpriseIdAndStatus(enterpriseId, StatusOS.FINISHED).stream()
                .filter(os -> os.getCompletionDate() != null &&
                        !os.getCompletionDate().isBefore(startOfDay) &&
                        !os.getCompletionDate().isAfter(endOfDay))
                .toList();

        BigDecimal totalIncome = finishedOs.stream()
                                           .map(os -> os.getTotals().total())
                                           .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Comissões geradas no dia → totalExpense
        BigDecimal totalExpense = commissionsRepository
                .findByEnterpriseIdAndDateCalculationBetween(enterpriseId, date, date).stream()
                .map(Commissions::getValueCommission)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // OS atrasadas (OPEN ou IN_PROGRESS com previsão vencida) → number
        long delayedCount = osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.OPEN).stream()
                                        .filter(os -> os.getForecastDate() != null &&
                                                os.getForecastDate().isBefore(LocalDateTime.now()))
                                        .count();

        delayedCount += osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.IN_PROGRESS).stream()
                                    .filter(os -> os.getForecastDate() != null &&
                                            os.getForecastDate().isBefore(LocalDateTime.now()))
                                    .count();

        // OS abertas (OPEN + IN_PROGRESS) no momento → openServiceOrders
        long openOsCount = osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.OPEN).size()
                + osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.IN_PROGRESS).size();

        // Títulos financeiros pendentes (OPEN e vencidos) → pendingTitles
        long pendingTitlesCount = financialTitleRepository
                .findByEnterpriseIdAndStatusAndDueDateBefore(
                        enterpriseId,
                        FinancialTitleStatus.OPEN,
                        LocalDate.now())
                .size();

        DashboardSnapshot snapshot = snapshotRepository
                .findByEnterpriseIdAndDate(enterpriseId, date)
                .orElse(new DashboardSnapshot());

        snapshot.setEnterpriseId(enterpriseId);
        snapshot.setDate(date);
        snapshot.setTotalIncome(totalIncome);
        snapshot.setTotalExpense(totalExpense);
        snapshot.setDelayedOsCount(BigDecimal.valueOf(delayedCount));       // OS atrasadas
        snapshot.setOpenedOsCount(BigDecimal.valueOf(openOsCount));         // OS em aberto
        snapshot.setPendingTitles(BigDecimal.valueOf(pendingTitlesCount));  // Títulos vencidos

        snapshotRepository.save(snapshot);
        log.info("Snapshot saved for enterprise {} on {}", enterpriseId, date);
    }


    public List<DashboardSnapshot> getLast30Days(UUID enterpriseId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);
        return snapshotRepository.findByEnterpriseIdAndDateBetweenOrderByDateAsc(enterpriseId, start, end);
    }
    
    public DashboardSnapshot getCurrentSnapshot(UUID enterpriseId) {
        LocalDate today = LocalDate.now();
        
        // 1. Receitas e Despesas DO DIA ATUAL (Baseado em Títulos Financeiros por Competência)
        List<FinancialTitle> titlesOfDay = financialTitleRepository
                .findByEnterpriseIdAndCompetenceDateBetween(enterpriseId, today, today);

        BigDecimal totalIncome = titlesOfDay.stream()
                .filter(t -> t.getType() == FinancialType.INCOME)
                .map(FinancialTitle::getOriginalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = titlesOfDay.stream()
                .filter(t -> t.getType() == FinancialType.EXPENSE)
                .map(FinancialTitle::getOriginalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Contadores em Tempo Real (Estado atual do sistema, independente da data)
        
        // OS Atrasadas
        long delayedCount = osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.OPEN).stream()
                .filter(os -> os.getForecastDate() != null && os.getForecastDate().isBefore(LocalDateTime.now()))
                .count();
        delayedCount += osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.IN_PROGRESS).stream()
                .filter(os -> os.getForecastDate() != null && os.getForecastDate().isBefore(LocalDateTime.now()))
                .count();

        // OS Abertas
        long openOsCount = osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.OPEN).size()
                + osRepository.findByEnterpriseIdAndStatus(enterpriseId, StatusOS.IN_PROGRESS).size();

        // Títulos Pendentes (Vencidos)
        long pendingTitlesCount = financialTitleRepository
                .findByEnterpriseIdAndStatusAndDueDateBefore(enterpriseId, FinancialTitleStatus.OPEN, LocalDate.now())
                .size();

        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setEnterpriseId(enterpriseId);
        snapshot.setDate(today);
        snapshot.setTotalIncome(totalIncome);
        snapshot.setTotalExpense(totalExpense);
        snapshot.setDelayedOsCount(BigDecimal.valueOf(delayedCount));
        snapshot.setOpenedOsCount(BigDecimal.valueOf(openOsCount));
        snapshot.setPendingTitles(BigDecimal.valueOf(pendingTitlesCount));

        return snapshot;
    }
}
