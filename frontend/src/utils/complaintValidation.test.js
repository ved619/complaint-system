import { describe, expect, it } from 'vitest';
import { validateComplaintForm } from './complaintValidation';

function validPayload() {
  return {
    customerDetails: {
      unit: 'Unit-1',
      location: 'Chennai',
      userName: 'Arun',
      contactNo: '9876543210',
    },
    systemDetails: {
      systemSerialNo: 'SYS-001',
    },
    items: [{ itemName: 'Power Supply', remark: 'Not working' }],
    spares: [{ replaced: '', replacedQty: 0, required: '', requiredQty: 0 }],
    charges: {
      charges: 200,
      gst: 18,
      warranty: false,
      amc: false,
      customerAcceptance: false,
    },
  };
}

describe('complaintValidation', () => {
  it('returns no errors for valid payload', () => {
    expect(validateComplaintForm(validPayload())).toEqual({});
  });

  it('requires customer name, serial no and at least one item', () => {
    const payload = validPayload();
    payload.customerDetails.userName = '';
    payload.systemDetails.systemSerialNo = '';
    payload.items = [{ itemName: '', remark: '' }];

    const errors = validateComplaintForm(payload);

    expect(errors['customerDetails.userName']).toBeTruthy();
    expect(errors['systemDetails.systemSerialNo']).toBeTruthy();
    expect(errors.items).toBeTruthy();
  });

  it('validates charges and gst range', () => {
    const payload = validPayload();
    payload.charges.charges = -1;
    payload.charges.gst = 120;

    const errors = validateComplaintForm(payload);
    expect(errors['charges.charges']).toBeTruthy();
    expect(errors['charges.gst']).toBeTruthy();
  });

  it('requires contact number to be exactly 10 digits', () => {
    const shortPayload = validPayload();
    shortPayload.customerDetails.contactNo = '98765';
    const shortErrors = validateComplaintForm(shortPayload);

    expect(shortErrors['customerDetails.contactNo']).toBeTruthy();

    const longPayload = validPayload();
    longPayload.customerDetails.contactNo = '98765432101';
    const longErrors = validateComplaintForm(longPayload);

    expect(longErrors['customerDetails.contactNo']).toBeTruthy();
  });

  it('validates spare qty when part names are entered', () => {
    const payload = validPayload();
    payload.spares = [{ replaced: 'Fan', replacedQty: 0, required: 'Board', requiredQty: 0 }];

    const errors = validateComplaintForm(payload);
    expect(errors['spares.0.replacedQty']).toBeTruthy();
    expect(errors['spares.0.requiredQty']).toBeTruthy();
  });
});
