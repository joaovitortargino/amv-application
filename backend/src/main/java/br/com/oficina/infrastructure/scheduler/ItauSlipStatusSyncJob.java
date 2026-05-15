package br.com.oficina.infrastructure.scheduler;

import br.com.oficina.application.service.SlipsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ItauSlipStatusSyncJob implements Job {

    private final SlipsService slipsService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("Starting Itau slip status sync job...");
        slipsService.syncProductionSlips();
        log.info("Itau slip status sync job finished.");
    }
}
