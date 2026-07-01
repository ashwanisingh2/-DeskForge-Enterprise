import {describe, expect, it} from 'vitest';
import {toCsv} from '../lib/export-csv';

describe('toCsv', () => {
  it('builds a header and escapes special characters', () => {
    const csv = toCsv(
      [{id: 'TKT-1', title: 'Hello, "world"', requester: {name: 'Rahul'}}],
      [
        {key: 'id', label: 'ID'},
        {key: 'title', label: 'Title'},
        {key: 'requester', label: 'Requester', value: (r: any) => r.requester.name},
      ],
    );
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('ID,Title,Requester');
    expect(row).toBe('TKT-1,"Hello, ""world""",Rahul');
  });

  it('neutralizes CSV injection payloads', () => {
    const csv = toCsv([{formula: '=cmd|/c calc'}], [{key: 'formula', label: 'Formula'}]);
    const row = csv.split('\r\n')[1];
    expect(row.startsWith("'=") || row.startsWith('"\'=')).toBe(true);
  });
});
