import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
    },
    subHeaderText: {
        fontSize: 10,
        color: '#666666',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 0,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 150,
        fontSize: 10,
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 10,
    },
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCell: {
        margin: "auto",
        marginTop: 5,
        fontSize: 10
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#666666',
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        paddingTop: 10,
    },
    signatureBox: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        width: 200,
        textAlign: 'center',
        paddingTop: 5,
        fontSize: 10,
    }
});

const RequestPDF = ({ request, researcher, service }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerText}>Genómica UCM</Text>
                    <Text style={styles.subHeaderText}>Unidad de Genómica - Universidad Complutense</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Solicitud: {request?.registrationNumber || 'N/A'}</Text>
                    <Text style={styles.subHeaderText}>Fecha: {request?.entryDate ? new Date(request.entryDate).toLocaleDateString() : 'N/A'}</Text>
                </View>
            </View>

            {/* Researcher Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Datos del Investigador</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre:</Text>
                    <Text style={styles.value}>{researcher?.fullName || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Institución:</Text>
                    <Text style={styles.value}>{researcher?.institution || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Departamento:</Text>
                    <Text style={styles.value}>{researcher?.department || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{researcher?.email || 'N/A'}</Text>
                </View>
            </View>

            {/* Request Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles de la Solicitud</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Servicio:</Text>
                    <Text style={styles.value}>{service?.name || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nº Muestras:</Text>
                    <Text style={styles.value}>{request?.samplesCount || 0}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Formato:</Text>
                    <Text style={styles.value}>{request?.format || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Info Adicional:</Text>
                    <Text style={styles.value}>{request?.additionalInfo || '-'}</Text>
                </View>
            </View>

            {/* Signature Area */}
            <View style={styles.signatureBox}>
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <View style={styles.signatureLine}>Firma Investigador</View>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                    <View style={styles.signatureLine}>Firma Responsable Unidad</View>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Gestión de Unidad de Genómica - Universidad Complutense de Madrid
            </Text>
        </Page>
    </Document>
);

export default RequestPDF;
