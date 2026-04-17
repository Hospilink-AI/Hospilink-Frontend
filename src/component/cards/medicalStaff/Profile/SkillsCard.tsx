// import { COLORS } from "@/constant/colors";
// import { StyleSheet, Text, View } from "react-native";

// interface Props { skills: string[]; }

// export default function SkillsCard({ skills }: Props) {
//   return (
//     <View style={styles.card}>
//       <Text style={styles.title}>Skills</Text>
//       <View style={styles.tags}>
//         {skills.map((skill) => (
//           <View key={skill} style={styles.tag}>
//             <Text style={styles.tagText}>{skill}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: COLORS.white,
//     borderRadius: 14,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   title: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 14 },
//   tags:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//   tag: {
//     backgroundColor: "#EEF2FF",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   tagText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
// });


import { COLORS } from "@/constant/colors";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { profileAPI } from "@/service/api";

interface Props { 
  skills: string[]; 
}

export default function SkillsCard({ skills: initialSkills }: Props) {
  // Initial state uses props
  const [skillsList, setSkillsList] = useState<string[]>(initialSkills);
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state if parent props change
  useEffect(() => {
    setSkillsList(initialSkills);
  }, [initialSkills]);

  const fetchUpdatedSkills = async () => {
    try {
      const data = await profileAPI.getSkills();
      if (data.success) {
        setSkillsList(data.skills);
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    }
  };

  const handleSaveSkill = async () => {
    if (!newSkill.trim()) {
      setIsAdding(false);
      return;
    }

    setIsLoading(true);
    try {
      // Append the new skill to the existing list
      const updatedSkillsArray = [...skillsList, newSkill.trim()];

      if (skillsList.length === 0) {
        // If empty, use POST
        await profileAPI.addSkills(updatedSkillsArray);
      } else {
        // If skills already exist, use PATCH
        await profileAPI.updateSkills(updatedSkillsArray);
      }

      // After successful POST/PATCH, call GET to refresh data
      await fetchUpdatedSkills();

      // Reset UI
      setNewSkill("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to save skill:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Skills</Text>
        {!isAdding && (
          <TouchableOpacity onPress={() => setIsAdding(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tags}>
        {skillsList.map((skill, index) => (
          <View key={`${skill}-${index}`} style={styles.tag}>
            <Text style={styles.tagText}>{skill}</Text>
          </View>
        ))}
        {skillsList.length === 0 && !isAdding && (
          <Text style={styles.emptyText}>No skills added yet.</Text>
        )}
      </View>

      {isAdding && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a skill (e.g. lab, nurse)..."
            value={newSkill}
            onChangeText={setNewSkill}
            autoFocus
          />
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSaveSkill}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border, // Make sure COLORS.border exists
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: COLORS.text // Make sure COLORS.text exists
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5", // Use your primary color here
  },
  tags: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#4F46E5" // Use your primary color here
  },
  emptyText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic"
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
    alignItems: "center"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  }
});