package br.com.oficina.infrastructure.scheduler;

import br.com.oficina.application.service.DashboardService;
import br.com.oficina.domain.entities.Enterprise;
import br.com.oficina.infrastructure.persistence.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyClosingJob implements Job {

    private final EnterpriseRepository enterpriseRepository;
    private final DashboardService dashboardService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("Starting Daily Closing Job...");
        
        // O fechamento é sempre referente ao dia anterior se rodar meia noite e um
        // Ou referente ao dia atual se rodar 23:59 , pegar dia atual
        LocalDate closingDate = LocalDate.now();

        List<Enterprise> enterprises = enterpriseRepository.findAll();

        for (Enterprise enterprise : enterprises) {
            if (enterprise.isActive()) {
                try {
                    dashboardService.processDailyClosing(enterprise.getId(), closingDate);
                } catch (Exception e) {
                    log.error("Error processing closing for enterprise {}", enterprise.getId(), e);
                }
            }
        }
        
        log.info("Daily Closing Job finished.");
    }
}
