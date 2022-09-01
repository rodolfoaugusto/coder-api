import { Duration } from 'aws-cdk-lib'

import {
  GraphWidget,
  GraphWidgetView,
  IMetric,
  Metric,
  Unit
} from 'aws-cdk-lib/aws-cloudwatch'

export function buildGraphWidget(
  widgetName: string,
  metrics: IMetric[],
  view: GraphWidgetView,
  stacked = false
): GraphWidget {
  return new GraphWidget({
    title: widgetName,
    left: metrics,
    stacked: stacked,
    width: 12,
    view: view
  })
}

export function metricForWaf(
  WebACL: string,
  metricName: string,
  label: string,
  rule: string,
  stat = 'sum'
): Metric {
  const dimensions = {
    WebACL: WebACL,
    Region: 'us-east-1',
    Rule: rule
  }

  return buildMetric(
    metricName,
    'AWS/WAFV2',
    dimensions,
    Unit.COUNT,
    label,
    stat,
    300
  )
}

export function metricForApiGw(
  apiName: string,
  metricName: string,
  label: string,
  stat = 'avg'
): Metric {
  const dimensions = {
    ApiName: apiName
  }

  return buildMetric(
    metricName,
    'AWS/ApiGateway',
    dimensions,
    Unit.COUNT,
    label,
    stat
  )
}

function buildMetric(
  metricName: string,
  namespace: string,
  dimensions: any,
  unit: Unit,
  label: string,
  stat = 'avg',
  period = 900
): Metric {
  return new Metric({
    metricName,
    namespace: namespace,
    dimensionsMap: dimensions,
    unit: unit,
    label: label,
    statistic: stat,
    period: Duration.seconds(period)
  })
}