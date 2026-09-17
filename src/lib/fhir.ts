import type { PatientEncounter } from '../types/backend';

export interface PatientDemographics {
  name: string;
  age: string;
  gender: string;
  abhaAddress: string;
}

/**
 * Deterministically generates an HL7 FHIR R4 standard bundle
 * compatible with India's ABDM requirements.
 */
export function generateFHIRBundle(encounter: PatientEncounter, demographics: PatientDemographics) {
  const summary = encounter.generated_summary;
  if (!summary) throw new Error('No summary available to generate FHIR');

  const bundle = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [] as any[],
  };

  // 1. Patient Resource (Demographics)
  bundle.entry.push({
    fullUrl: `urn:uuid:${encounter.patient_id}`,
    resource: {
      resourceType: 'Patient',
      id: encounter.patient_id,
      identifier: [
        {
          system: 'https://healthid.ndhm.gov.in',
          value: demographics.abhaAddress,
        },
      ],
      name: [
        {
          text: demographics.name,
        },
      ],
      gender: demographics.gender.toLowerCase(),
      // Calculate an approximate birthDate from age (required by ABDM)
      birthDate: new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(demographics.age || '0'))).toISOString().split('T')[0],
    },
  });

  // 2. Condition Resource (Chief Complaint & Final Diagnosis)
  if (summary.chiefComplaint || encounter.doctor_diagnosis) {
    bundle.entry.push({
      fullUrl: `urn:uuid:condition-${encounter.id}`,
      resource: {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis',
              },
            ],
          },
        ],
        code: {
          text: encounter.doctor_diagnosis || summary.chiefComplaint,
        },
        subject: {
          reference: `urn:uuid:${encounter.patient_id}`,
        },
        note: [
          {
            text: summary.hpiNarrative || '',
          },
        ],
      },
    });
  }

  // 3. MedicationRequest Resource (Prescriptions)
  if (encounter.doctor_prescription) {
    const meds = encounter.doctor_prescription.split('\n').filter(m => m.trim().length > 0);
    meds.forEach((med, idx) => {
      bundle.entry.push({
        fullUrl: `urn:uuid:medication-${encounter.id}-${idx}`,
        resource: {
          resourceType: 'MedicationRequest',
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: med,
          },
          subject: {
            reference: `urn:uuid:${encounter.patient_id}`,
          },
          authoredOn: new Date().toISOString(),
        },
      });
    });
  }

  // 4. Observation Resource (AYUSH Prakriti Assessment)
  if (summary.prakritiResult) {
    bundle.entry.push({
      fullUrl: `urn:uuid:observation-prakriti-${encounter.id}`,
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'exam',
                display: 'Exam',
              },
            ],
          },
        ],
        code: {
          text: 'Ayurvedic Prakriti (Body Constitution)',
        },
        subject: {
          reference: `urn:uuid:${encounter.patient_id}`,
        },
        valueString: `${summary.prakritiResult.primaryDosha} ${summary.prakritiResult.secondaryDosha ? `- ${summary.prakritiResult.secondaryDosha}` : ''}`,
        component: [
          {
            code: { text: 'Vata Percentage' },
            valueQuantity: { value: summary.prakritiResult.percentages.vata, unit: '%' },
          },
          {
            code: { text: 'Pitta Percentage' },
            valueQuantity: { value: summary.prakritiResult.percentages.pitta, unit: '%' },
          },
          {
            code: { text: 'Kapha Percentage' },
            valueQuantity: { value: summary.prakritiResult.percentages.kapha, unit: '%' },
          },
        ],
      },
    });
  }

  return bundle;
}
