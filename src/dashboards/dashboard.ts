import { Fn } from 'aws-cdk-lib'
import {
  Dashboard,
  GraphWidgetView,
  LogQueryWidget,
  LogQueryVisualizationType,
  TextWidget,
} from 'aws-cdk-lib/aws-cloudwatch'

import { Construct } from 'constructs'
import { buildGraphWidget, metricForApiGw } from './dashboard-helpers'

export interface SupportDashboardProps {
  readonly restApiName: string
  readonly logGroupName: string
}

export class coderAPIDashboard extends Dashboard {
  constructor(scope: Construct, id: string, props: SupportDashboardProps) {
    const { restApiName, logGroupName } = props

    super(scope, id, {
      dashboardName: `${restApiName}-support-dashboard`
    })

    const stage = process.env.STAGE || ''

    this.addWidgets(
      new TextWidget({
        markdown: `# ${stage.toUpperCase()} STAGE`,
        width: 24
      }),
      new LogQueryWidget({
        title: 'Requests by Resource Path',
        logGroupNames: [logGroupName],
        view: LogQueryVisualizationType.PIE,
        // The lines will be automatically combined using '\n|'.
        queryLines: [
          'stats count (ip) as requestCount by resourcePath,httpMethod'
        ],
        width: 8
      }),
      buildGraphWidget(
        'Total number of Requests',
        [metricForApiGw(restApiName, 'Count', '# Requests', 'sum')],
        GraphWidgetView.TIME_SERIES
      ),
      buildGraphWidget(
        'Requests Latency',
        [
          metricForApiGw(
            restApiName,
            'Latency',
            '50% of requests (p50)',
            'p50'
          ),
          metricForApiGw(
            restApiName,
            'Latency',
            '90% of requests (p90)',
            'p90'
          ),
          metricForApiGw(
            restApiName,
            'Latency',
            '99% of requests (p99)',
            'p99'
          )
        ],
        GraphWidgetView.TIME_SERIES,
        true
      ),
      new LogQueryWidget({
        title: 'Authorization Cold Starts %',
        logGroupNames: [logGroupName],
        view: LogQueryVisualizationType.TABLE,
        // The lines will be automatically combined using '\n|'.
        queryLines: [
          'stats sum(strcontains(@message, "Init Duration"))/count(*) * 100 as coldStart, avg(@duration) as averageDuration by bin(5m) as initPeriod',
          'limit 10'
        ],
        width: 8
      }),
      new LogQueryWidget({
        title: 'Top Users by No. of requests',
        logGroupNames: [logGroupName],
        view: LogQueryVisualizationType.TABLE,
        // The lines will be automatically combined using '\n|'.
        queryLines: [
          'stats count(count) as requestCount by ip',
          'filter @message like /User Info:/',
          'sort requestCount desc',
          'limit 10000'
        ],
        width: 8
      }),
      buildGraphWidget(
        'User Errors (4XX)',
        [metricForApiGw(restApiName, '4XXError', '4XX Errors', 'sum')],
        GraphWidgetView.TIME_SERIES,
        true
      ),
      buildGraphWidget(
        'Internal Errors (5XX)',
        [metricForApiGw(restApiName, '5XXError', '5XX Errors', 'sum')],
        GraphWidgetView.TIME_SERIES,
        true
      ),
      new LogQueryWidget({
        title: 'List of Errors on Live',
        logGroupNames: [logGroupName],
        view: LogQueryVisualizationType.TABLE,
        queryLines: [
          'fields ip as IP, user as UserId, resourcePath as URL, httpMethod as Method, status as Status, requestTime as Time',
          'filter status >= 400',
          'sort @timestamp desc',
          'limit 30'
        ],
        width: 24
      })
    )
  }
}
