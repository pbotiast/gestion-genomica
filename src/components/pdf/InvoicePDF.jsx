import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
    },
    invoiceDetails: {
        textAlign: 'right',
    },
    billTo: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        textDecoration: 'underline',
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 20,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '75%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    tableColHeaderAmount: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
        padding: 5,
        textAlign: 'right',
    },
    tableCol: {
        width: '75%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableColAmount: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
    },
    totalValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: 'grey',
        borderTopWidth: 1,
        borderColor: '#ccc',
        paddingTop: 10,
    }
});

const InvoicePDF = ({ invoice, researcher, requests, services }) => {
    // Helper to get service name
    const getServiceName = (serviceId) => {
        const s = services.find(srv => srv.id === serviceId);
        return s ? s.name : `Servicio #${serviceId}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>FACTURA</Text>
                        <Text>Genómica UCM</Text>
                    </View>
                    <View style={styles.invoiceDetails}>
                        <Text style={{ fontWeight: 'bold' }}>Nº Factura: {invoice?.invoiceNumber}</Text>
                        <Text>Fecha: {new Date(invoice?.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Bill To */}
                <View style={styles.billTo}>
                    <Text style={styles.sectionTitle}>Facturar a:</Text>
                    <Text style={{ fontWeight: 'bold' }}>{researcher?.fullName}</Text>
                    <Text>{researcher?.department}</Text>
                    <Text>{researcher?.institution}</Text>
                    <Text>CIF/NIF: {researcher?.idNumber || 'N/A'}</Text>
                    <Text>{researcher?.fiscalAddress}</Text>
                </View>

                {/* Table Header */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableColHeader}>Descripción / Servicio</Text>
                        <Text style={styles.tableColHeaderAmount}>Importe</Text>
                    </View>

                    {/* Table Rows (Requests) */}
                    {requests.map((req, index) => {
                        // Logic to calculate price
                        const service = services.find(s => s.id === req.serviceId);
                        const tariff = researcher?.tariff || 'C'; // Default to C if unknown
                        let unitPrice = 0;
                        if (service) {
                            switch (tariff) {
                                case 'A': unitPrice = service.priceA; break;
                                case 'B': unitPrice = service.priceB; break;
                                case 'C': unitPrice = service.priceC; break;
                                default: unitPrice = service.priceC;
                            }
                        }
                        const count = req.finalSamplesCount || req.samplesCount || 0;
                        const totalCost = unitPrice * count;

                        return (
                            <View style={styles.tableRow} key={index}>
                                <Text style={styles.tableCol}>
                                    Solicitud {req.registrationNumber} - {getServiceName(req.serviceId)} ({count} muestras)
                                </Text>
                                <Text style={styles.tableColAmount}>
                                    {totalCost.toFixed(2)} €
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL:</Text>
                    <Text style={styles.totalValue}>{invoice?.amount?.toFixed(2)} €</Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Genómica UCM - Universidad Complutense de Madrid
                </Text>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
