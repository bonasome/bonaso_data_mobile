import StyledButton from "@/components/inputs/StyledButton";
import StyledScroll from "@/components/styledScroll";
import { Respondent } from "@/database/ORM/tables/respondents";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function edit(){
    const router = useRouter();
    const [respondents, setRespondents] = useState([]);
    
    useEffect(() => {
        const loadData = async() => {
            const rInstances = await Respondent.all()
            const rSerialized = await Promise.all(rInstances.map(r => r.serialize()));
            setRespondents(rSerialized);
        }
        loadData();
    }, []);

    function goToEdit(id){
        router.push({ 
            pathname: '/authorized/create/CreateRespondent', 
            params: { local_id: id } 
        });
    }

    return(
        <StyledScroll>
            <View>
                {respondents.map(r => (
                    <StyledButton key={r.local_id} onPress={() => goToEdit(r.local_id)} label={`${r.first_name} ${r.last_name}`} />
                ))}
            </View>
        </StyledScroll>
    )

}