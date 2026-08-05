import PortalUsage from '@/component/cards/admin/Dashboard/PortalUsage';
import React from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from 'react-native-element-dropdown';

import { adminAPI } from "@/service/api";



const mapAdmin = (a: any) => ({
    id: a._id ?? a.id ?? a.adminId ?? "",
    name: a.name ?? "Unknown",
    role: a.role ?? "Admin",
    subRole: a.adminSubRole ?? a.subRole ?? "",
    email: a.email ?? "—",
    phone: a.phone ?? a.phoneNumber ?? "",
    status: a.isActive === false ? "Inactive" : (a.status ?? "Active"),
});



export default function AdminLogs() {

    const [showCreateAdmin, setShowCreateAdmin] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);
    const [selectedAdmin, setSelectedAdmin] = React.useState<any>(null);
    const [showDeactivateModal, setShowDeactivateModal] = React.useState(false);

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [role, setRole] = React.useState("");

    const [admins, setAdmins] = React.useState<any[]>([]);
    const [listLoading, setListLoading] = React.useState(true);
    const [detailsLoading, setDetailsLoading] = React.useState(false);
    const [createLoading, setCreateLoading] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);

    const roles = [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Operational Manager', value: 'operations_manager' },
        { label: 'Tech Support', value: 'tech_support' },
    ];

    const fetchAdminList = React.useCallback(async () => {
        setListLoading(true);
        try {
            const res = await adminAPI.getAdminList();
            const list = res?.data ?? res?.admins ?? res ?? [];
            setAdmins(Array.isArray(list) ? list.map(mapAdmin) : []);
        } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message ?? "Failed to load admin list.");
        } finally {
            setListLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAdminList();
    }, [fetchAdminList]);

    const handleViewDetails = async (item: any) => {
        setSelectedAdmin(item);
        setShowDetails(true);
        setDetailsLoading(true);
        try {
            const res = await adminAPI.getAdminDetail(item.id);
            const detail = res?.data ?? res?.admin ?? res;
            setSelectedAdmin(mapAdmin(detail));
        } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message ?? "Failed to load admin details.");
            setShowDetails(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>

            <Text style={[styles.cell, { flex: 1 }]}>{item.role}</Text>

            <Text style={[styles.cell, {
                flex: 1, color: item.status === "Active" ? "#16A34A" : "#DC2626",
                fontWeight: "600",
            }]}>{item.status}</Text>

            <TouchableOpacity
                style={{
                    flex: 1,
                    alignItems: "flex-end"
                }}
                onPress={() => handleViewDetails(item)}
            >
                <Text style={styles.details}>Details</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <SafeAreaView style={styles.screen}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.title}>Tom Hiddleston</Text>
                        <Text style={styles.subtitle}>Super Admin</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => setShowCreateAdmin(true)}
                    >
                        <Text style={styles.createBtnText}>+ Create Admin</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard */}
                <View style={styles.dashboard}>
                    {/* Left Side */}
                    <View style={styles.leftSection}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Admin List</Text>

                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerText, { flex: 2 }]}>NAME</Text>
                                <Text style={[styles.headerText, { flex: 1 }]}>ROLE</Text>
                                <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
                                <Text
                                    style={[
                                        styles.headerText,
                                        {
                                            flex: 1,
                                            textAlign: "right",
                                        },
                                    ]}
                                >
                                    ACTION
                                </Text>
                            </View>

                            {listLoading ? (
                                <ActivityIndicator style={{ marginVertical: 30 }} color="#2563EB" />
                            ) : (
                                <FlatList
                                    data={admins}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderItem}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    Showing 1-10 of 10 admins
                                </Text>

                                <View style={styles.pagination}>
                                    <TouchableOpacity style={styles.pageArrow}>
                                        <Text>{"‹"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.page, styles.activePage]}
                                    >
                                        <Text style={styles.activePageText}>1</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.page}>
                                        <Text>2</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.page}>
                                        <Text>3</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.pageArrow}>
                                        <Text>{"›"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Right Side */}
                    <View style={styles.rightSection}>
                        {/* Availability */}
                        <View style={styles.sideCard}>
                            <Text style={styles.sideTitle}>
                                Admin Availability
                            </Text>

                            <View style={styles.availabilityRow}>
                                <View style={styles.circle}>
                                    <Text style={styles.circleText}>100%</Text>
                                </View>

                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.adminTitle}>Admins</Text>
                                    <Text style={styles.adminSubtitle}>
                                        RMO - General Medicine
                                    </Text>
                                </View>

                                <Text style={styles.activeText}>
                                    18/20 Active
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.reportButton}>
                                <Text style={styles.reportText}>
                                    View Detailed Report
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Calendar */}
                        <View style={[styles.sideCard, { marginTop: 20 }]}>
                            <PortalUsage />
                        </View>
                    </View>
                </View>
            </SafeAreaView>


            <Modal
                visible={showCreateAdmin}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateAdmin(false)}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalCard}>

                        {/* Header */}

                        <View style={styles.modalHeader}>

                            <View>
                                <Text style={styles.modalTitle}>
                                    Create Admin
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    Specify details for the Admin
                                </Text>
                            </View>


                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowCreateAdmin(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>



                        </View>

                        {/* Row 1 */}

                        <View style={styles.formRow}>

                            <View style={styles.inputGroup}>

                                <Text style={styles.label}>
                                    Name
                                </Text>

                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Sunil Patil"
                                    style={styles.input}
                                />

                            </View>

                            {/* <View style={styles.inputGroup}>

                                <Text style={styles.label}>
                                    Admin Sub-Role
                                </Text>

                                <TextInput
                                    value={role}
                                    onChangeText={setRole}
                                    placeholder="Select Sub-Role"
                                    style={styles.input}
                                />

                            </View> */}


                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Admin Sub-Role</Text>

                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={roles}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Sub-Role"
                                    value={role}
                                    onChange={(item) => setRole(item.value)}
                                />
                            </View>

                        </View>

                        {/* Row 2 */}

                        <View style={styles.formRow}>

                            <View style={styles.inputGroup}>

                                <Text style={styles.label}>
                                    Email
                                </Text>

                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="admin@gmail.com"
                                    style={styles.input}
                                />

                            </View>

                            <View style={styles.inputGroup}>

                                <Text style={styles.label}>
                                    Password
                                </Text>

                                <TextInput
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="******"
                                    style={styles.input}
                                />

                            </View>

                        </View>

                        <View style={styles.footerButtonContainer}>
                            <TouchableOpacity
                                style={styles.createBtn}
                                disabled={createLoading}
                                onPress={async () => {
                                    if (!name.trim() || !email.trim() || !password.trim() || !role.trim()) {
                                        Alert.alert("Missing details", "Please fill in all fields.");
                                        return;
                                    }
                                    setCreateLoading(true);
                                    try {
                                        await adminAPI.createAdmin({
                                            name: name.trim(),
                                            email: email.trim(),
                                            password,
                                            adminSubRole: role.trim(),
                                        });
                                        setShowCreateAdmin(false);
                                        setName("");
                                        setEmail("");
                                        setPassword("");
                                        setRole("");
                                        fetchAdminList();
                                    } catch (err: any) {
                                        Alert.alert("Error", err?.response?.data?.message ?? "Failed to create admin.");
                                    } finally {
                                        setCreateLoading(false);
                                    }
                                }}
                            >
                                {createLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.createBtnText}>
                                        Create Admin
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>

            </Modal>


            <Modal
                visible={showDetails}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetails(false)}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.detailsModal}>

                        <Text style={styles.detailsTitle}>
                            Details
                        </Text>

                        <View style={styles.detailsRow}>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>
                                    Name
                                </Text>

                                <Text style={styles.detailValue}>
                                    {selectedAdmin?.name}
                                </Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>
                                    Role
                                </Text>

                                <Text style={styles.detailValue}>
                                    {selectedAdmin?.role}
                                </Text>
                            </View>

                        </View>

                        <View style={{ marginTop: 30 }}>

                            <Text style={styles.detailLabel}>
                                Email
                            </Text>

                            <Text style={styles.detailValue}>
                                {selectedAdmin?.email}
                            </Text>

                        </View>

                        <View style={styles.separator} />

                        <View style={styles.actionRow}>

                            <TouchableOpacity
                                style={styles.inactiveBtn}
                                disabled={actionLoading}
                                onPress={async () => {
                                    setActionLoading(true);
                                    try {
                                        await adminAPI.activateAdmin(selectedAdmin.id);
                                        setShowDetails(false);
                                        fetchAdminList();
                                    } catch (err: any) {
                                        Alert.alert("Error", err?.response?.data?.message ?? "Failed to activate admin.");
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                            >

                                <Text style={styles.inactiveText}>
                                    Activate
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deactivateBtn}
                                onPress={() => {
                                    setShowDetails(false);
                                    setShowDeactivateModal(true);
                                }}
                            >

                                <Text style={styles.actionText}>
                                    Deactivate
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.updateBtn}
                            >

                                <Text style={styles.actionText}>
                                    Update Role
                                </Text>

                            </TouchableOpacity>

                        </View>

                    </View>

                </View>

            </Modal>


            <Modal
                visible={showDeactivateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeactivateModal(false)}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.confirmModal}>

                        <View style={styles.warningCircle}>
                            <Text style={styles.warningIcon}>!</Text>
                        </View>

                        <Text style={styles.confirmTitle}>
                            Do you want to deactivate{"\n"}the account?
                        </Text>

                        <View style={styles.confirmButtons}>

                            <TouchableOpacity
                                style={styles.confirmDeactivateBtn}
                                disabled={actionLoading}
                                onPress={async () => {
                                    setActionLoading(true);
                                    try {
                                        await adminAPI.deactivateAdmin(selectedAdmin.id);
                                        setShowDeactivateModal(false);
                                        fetchAdminList();
                                    } catch (err: any) {
                                        Alert.alert("Error", err?.response?.data?.message ?? "Failed to deactivate admin.");
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmDeactivateText}>
                                        Deactivate
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setShowDeactivateModal(false);
                                }}
                            >
                                <Text style={styles.cancelText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                        </View>

                    </View>

                </View>

            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F3F6FB",
        margin: 20
    },

    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: "#64748B",
    },

    createBtn: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
    },

    createBtnText: {
        color: "#fff",
        fontWeight: "600",
    },

    dashboard: {
        flex: 1,
        flexDirection: "row",
    },

    leftSection: {
        flex: 2,
        marginRight: 20,

    },

    rightSection: {
        width: 320,
    },

    card: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        padding: 18,
        color: "#111827",
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F8FAFC",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 18,
        paddingVertical: 12,
    },

    headerText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94A3B8",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#EEF2F7",
    },

    cell: {
        fontSize: 14,
        color: "#1F2937",
    },

    details: {
        color: "#2563EB",
        fontWeight: "600",
    },

    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
    },

    footerText: {
        fontSize: 12,
        color: "#94A3B8",
    },

    pagination: {
        flexDirection: "row",
    },

    page: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 3,
    },

    activePage: {
        backgroundColor: "#2563EB",
    },

    activePageText: {
        color: "#fff",
        fontWeight: "700",
    },

    pageArrow: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 3,
    },

    sideCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    sideTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 18,
        color: "#111827",
    },

    availabilityRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    circle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 4,
        borderColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
    },

    circleText: {
        fontSize: 11,
        fontWeight: "700",
    },

    adminTitle: {
        fontWeight: "700",
        color: "#111827",
    },

    adminSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2,
    },

    activeText: {
        marginLeft: "auto",
        color: "#94A3B8",
        fontSize: 12,
    },

    reportButton: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        alignItems: "center",
        paddingVertical: 10,
    },

    reportText: {
        color: "#475569",
        fontWeight: "500",
    },


    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalCard: {
        width: "70%",
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 40,
    },

    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 35,
    },

    modalTitle: {
        fontSize: 40,
        fontWeight: "700",
        color: "#111827",
    },

    modalSubtitle: {
        marginTop: 6,
        color: "#8B8B8B",
        fontSize: 18,
    },

    formRow: {
        flexDirection: "row",
        marginBottom: 22,
    },

    inputGroup: {
        flex: 1,
        marginHorizontal: 10,
    },

    label: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
        color: "#111827",
    },

    input: {
        height: 55,
        borderWidth: 1,
        borderColor: "#D9E2EF",
        borderRadius: 10,
        paddingHorizontal: 18,
        fontSize: 16,
        backgroundColor: "#fff",
    },


    detailsModal: {
        width: "60%",
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 35,
    },

    detailsTitle: {
        fontSize: 34,
        fontWeight: "700",
        marginBottom: 30,
        color: "#1F2937",
    },

    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    detailItem: {
        width: "45%",
    },

    detailLabel: {
        fontSize: 16,
        color: "#64748B",
    },

    detailValue: {
        marginTop: 8,
        fontSize: 22,
        fontWeight: "700",
        color: "#1F2937",
    },

    separator: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 35,
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    inactiveBtn: {
        flex: 1,
        marginRight: 12,
        backgroundColor: "#E2E8F0",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 16,
    },

    inactiveText: {
        color: "#64748B",
        fontSize: 18,
        fontWeight: "700",
    },

    deactivateBtn: {
        flex: 1,
        marginHorizontal: 12,
        backgroundColor: "#EF4444",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 16,
    },

    updateBtn: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 16,
    },

    actionText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    confirmModal: {
        width: "45%",
        backgroundColor: "#fff",
        borderRadius: 28,
        padding: 40,
        alignItems: "center",
    },

    warningCircle: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
    },

    warningIcon: {
        fontSize: 42,
        color: "#EF4444",
        fontWeight: "700",
    },

    confirmTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#1F2937",
        textAlign: "center",
        marginTop: 28,
        lineHeight: 36,
    },

    confirmButtons: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginTop: 40,
    },


    confirmDeactivateBtn: {
        width: 220,
        height: 64,
        backgroundColor: "#EF4444",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    confirmDeactivateText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },

    cancelBtn: {
        width: 220,
        height: 64,
        backgroundColor: "#EEF2F7",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelText: {
        color: "#64748B",
        fontSize: 20,
        fontWeight: "700",
    },
    dropdown: {
        height: 50,
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },

    placeholderStyle: {
        color: '#9CA3AF',
        fontSize: 16,
    },

    selectedTextStyle: {
        fontSize: 16,
        color: '#111827',
    },

    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },

    closeButtonText: {
        fontSize: 24,
        color: "#6B7280",
        fontWeight: "700",
    },

    footerButtonContainer: {
        marginTop: 30,
        alignItems: "center",
    },

    bottomCreateBtn: {
        width: 220,
        height: 55,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center"
    },

    
});