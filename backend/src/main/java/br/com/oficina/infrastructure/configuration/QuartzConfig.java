package br.com.oficina.infrastructure.configuration;

import br.com.oficina.infrastructure.scheduler.DailyClosingJob;
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
}
