import type { CaseStudy } from '../../types/caseStudy'

import uc1 from './uc-1-library-kiosk.json'
import uc2 from './uc-2-food-delivery-platform.json'
import uc3 from './uc-3-telehealth-portal.json'
import er1 from './er-1-university-enrollment.json'
import er2 from './er-2-ecommerce-orders.json'
import er3 from './er-3-hospital-ward-management.json'
import class1 from './class-1-smart-home-devices.json'
import class2 from './class-2-ride-hailing-dispatch.json'
import class3 from './class-3-notification-pipeline.json'
import dfd1 from './dfd-1-student-grading-portal.json'
import dfd2 from './dfd-2-clinic-billing-flow.json'
import dfd3 from './dfd-3-iot-telemetry-pipeline.json'

export const CASE_STUDIES: CaseStudy[] = [
  uc1,
  uc2,
  uc3,
  er1,
  er2,
  er3,
  class1,
  class2,
  class3,
  dfd1,
  dfd2,
  dfd3,
] as CaseStudy[]

