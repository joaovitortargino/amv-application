package br.com.oficina.infrastructure.configuration;

import br.com.oficina.infrastructure.scheduler.DailyClosingJob;
import br.com.oficina.infrastructure.scheduler.ItauSlipStatusSyncJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    @Bean
    public JobDetail dailyClosingJobDetail() {
        return JobBuilder.newJob(DailyClosingJob.class)
                .withIdentity("dailyClosingJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger dailyClosingJobTrigger() {
        // 23:59 todo dia
        return TriggerBuilder.newTrigger()
                .forJob(dailyClosingJobDetail())
                .withIdentity("dailyClosingTrigger")
                .withSchedule(CronScheduleBuilder.dailyAtHourAndMinute(23, 59))
                .build();
    }

    @Bean
    public JobDetail itauSlipStatusSyncJobDetail() {
        return JobBuilder.newJob(ItauSlipStatusSyncJob.class)
                .withIdentity("itauSlipStatusSyncJob")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger itauSlipStatusSyncJobTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(itauSlipStatusSyncJobDetail())
                .withIdentity("itauSlipStatusSyncTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0/15 * * * ?"))
                .build();
    }
}
