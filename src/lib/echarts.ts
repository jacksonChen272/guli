import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, LineChart, RadarChart, ScatterChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([ScatterChart, LineChart, BarChart, RadarChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, TitleComponent, CanvasRenderer])

export { echarts }
export type { EChartsCoreOption as EChartsOption } from 'echarts/core'
