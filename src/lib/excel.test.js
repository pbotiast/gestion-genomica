import { describe, it, expect, vi } from 'vitest';
import { parseServicesExcel } from './excel';
import * as XLSX from 'xlsx';

vi.mock('xlsx', () => ({
    read: vi.fn(),
    utils: {
        sheet_to_json: vi.fn()
    }
}));

describe('parseServicesExcel', () => {
    it('parses excel file and maps columns', async () => {
        // Mock FileReader
        const mockFileReader = {
            readAsArrayBuffer: vi.fn(),
            onload: null,
            onerror: null,
            result: new ArrayBuffer(8)
        };

        // Mock window.FileReader
        vi.stubGlobal('FileReader', vi.fn(() => mockFileReader));

        // Mock XLSX behavior
        XLSX.read.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { 'Sheet1': {} }
        });

        const mockData = [
            { 'Servicio': 'Service 1', 'Formato': 'Tube', 'Precio A': 10, 'Precio B': 20, 'Precio C': 30 },
            { 'Servicio': 'Service 2', 'Formato': 'Plate', 'Precio A': 15, 'Precio B': 25, 'Precio C': 35 }
        ];
        XLSX.utils.sheet_to_json.mockReturnValue(mockData);

        // Trigger the promise
        const promise = parseServicesExcel(new File([''], 'test.xlsx'));

        // Manually trigger onload to resolve promise since we mocked FileReader
        mockFileReader.onload({ target: { result: mockFileReader.result } });

        const result = await promise;

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            name: 'Service 1',
            format: 'Tube',
            priceA: 10,
            priceB: 20,
            priceC: 30
        });
    });
});
