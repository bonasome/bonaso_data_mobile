import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo } from "react";
import { View } from "react-native";
import Input from "./inputs/Input";
import StyledButton from "./inputs/StyledButton";
import StyledText from "./styledText";

export default function IndexWrapper({ children, page, onPageChange, onSearchChange, entries, fromServer=false }){
    /*
    Helpful wrapper that surrounds an index component and handles things like search/pages. Passes that information
    back up to the parent so the correct API request can be made.
    - children (component): the index component this is wrapping around
    - page (integer): the current page the user is on
    - onSearchChange (function): function to run when user types in search bar
    - onPageChange (function): function to run when user clicks a page forward/backward button
    - entries (integer): total number of entries for calculating total pages
    */
    const totalPages = useMemo(() => {
        return Math.ceil(entries / (fromServer ? 20 : 10)) == 0 ? 1 : Math.ceil(entries / (fromServer ? 20 : 10));
    }, [entries]);

    //handle change in search bar and pass value to children
    const handleSearch = (val) => {
        onSearchChange?.(val); // optional chaining in case the prop isn't passed
        onPageChange(1); // tell parent we moved to page 1
    };

    //handle page change and pass value to children
    const handlePageChange = (newPage) => {
        onPageChange(newPage);
    };

    return( 
        <View>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <FontAwesome name="search" size={24} color="white" style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 20 }} />
                <Input keyboard='text' onChange={(v) => handleSearch(v)} placeholder={'start typing to search'} style={{ width: '80%'}}/>
            </View>

            { children }
            {totalPages > 1 && <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 30}}>
                <StyledButton onPress={() => handlePageChange(page - 1)} label='Previous' disabled={page == 1} />
                <View style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', marginStart: 20, marginEnd: 20}}>
                    <StyledText>Page</StyledText>
                    <StyledText>{page} of {totalPages}</StyledText>
                </View>
                <StyledButton onPress={() => handlePageChange(page + 1)} label='Next' disabled={page == (totalPages)} />
            </View>}
        </View>
    )

}